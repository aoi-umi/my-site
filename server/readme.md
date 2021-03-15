## 环境

## 系统: centos

rabbitmq

> wget http://www.rabbitmq.com/releases/erlang/erlang-19.0.4-1.el7.centos.x86_64.rpm  
> wget http://www.rabbitmq.com/releases/rabbitmq-server/v3.6.6/rabbitmq-server-3.6.6-1.el7.noarch.rpm  
> rpm -ivh erlang-19.0.4-1.el7.centos.x86_64.rpm  
> yum -y install erlang  
> yum -y install rabbitmq-server-3.6.6-1.el7.noarch.rpm

配置

> vi /etc/rabbitmq/rabbitmq-env.conf  
> NODENAME=rabbit@localhost

设为开机启动

> chkconfig rabbitmq-server on  
>  service rabbitmq-server start

web 管理

> rabbitmq-plugins enable rabbitmq_management

创建用户

> rabbitmqctl add_user admin admin  
> rabbitmqctl set_user_tags admin administrator  

## apidoc
### 插件 apidoc-plugin-class-validator
